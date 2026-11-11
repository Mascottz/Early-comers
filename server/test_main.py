"""Focused API and persistence tests, using an isolated attendance database."""

import tempfile
import unittest
from pathlib import Path

from fastapi import HTTPException

from server import main


class AttendanceTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        main.DB = Path(self.temporary.name) / "test-attendance.db"
        main.initialise()

    def tearDown(self):
        self.temporary.cleanup()

    def test_seed_has_a_team_and_daily_wall(self):
        state = main.state()
        self.assertEqual(len(state["workers"]), 8)
        self.assertGreater(len(state["entries"]), 7)
        self.assertEqual(state["officeCode"], main.OFFICE_CODE)

    def test_checkin_preserves_device_date_and_time(self):
        check_in = main.CheckIn(
            id="offline-record-1",
            worker_id="w1",
            occurred_at=1794387960000,
            source="Offline check-in",
            local_date="2026-11-12",
            local_time="00:30",
        )
        result = main.checkin(check_in)
        self.assertEqual(result["date"], "2026-11-12")
        self.assertEqual(result["time"], "00:30")
        self.assertEqual(result["source"], "Offline check-in")

    def test_duplicate_checkin_returns_original_record(self):
        first = main.CheckIn(
            id="first-record", worker_id="w1", occurred_at=1794387960000,
            local_date="2026-11-12", local_time="08:01",
        )
        duplicate = main.CheckIn(
            id="second-record", worker_id="w1", occurred_at=1794387961000,
            local_date="2026-11-12", local_time="08:02",
        )
        main.checkin(first)
        result = main.checkin(duplicate)
        self.assertEqual(result["id"], "first-record")
        self.assertEqual(result["time"], "08:01")

    def test_unknown_worker_is_rejected(self):
        record = main.CheckIn(worker_id="missing", occurred_at=1794387960000)
        with self.assertRaises(HTTPException) as error:
            main.checkin(record)
        self.assertEqual(error.exception.status_code, 404)

    def test_new_worker_joins_shared_state(self):
        worker = main.create_worker(main.NewWorker(name="Ada Obi", title="Research"))
        self.assertEqual(worker["initials"], "AO")
        self.assertEqual(len(main.state()["workers"]), 9)

    def test_office_pass_is_dated_for_today(self):
        payload = main.office_pass_payload()
        self.assertEqual(
            payload,
            f"proofstech://attendance?office={main.OFFICE_CODE}&day={main.lagos_today().isoformat()}",
        )
        self.assertEqual(main.office_pass_payload("2026-11-11").split("&day=")[1], "2026-11-11")

    def test_office_qr_is_an_uncached_svg(self):
        response = main.office_qr()
        self.assertEqual(response.media_type, "image/svg+xml")
        self.assertIn(b"<svg", response.body)
        self.assertIn("no-store", response.headers["cache-control"])

    def test_invite_page_is_available_and_private(self):
        response = main.invite_page()
        self.assertEqual(Path(response.path).name, "invite.html")
        page = (main.PUBLIC / "invite.html").read_text(encoding="utf-8")
        self.assertIn("/auth/v1/verify", page)
        self.assertIn('name="referrer" content="no-referrer"', page)


if __name__ == "__main__":
    unittest.main()
