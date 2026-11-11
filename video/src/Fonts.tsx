import React, { useEffect, useState } from 'react';
import { continueRender, delayRender, staticFile } from 'remotion';

const fontCss = `
@font-face {
  font-family: "Bricolage Grotesque";
  src: url("${staticFile('fonts/bricolage-grotesque-latin-600-normal.woff2')}") format("woff2");
  font-weight: 600;
  font-style: normal;
  font-display: block;
}
@font-face {
  font-family: "Bricolage Grotesque";
  src: url("${staticFile('fonts/bricolage-grotesque-latin-700-normal.woff2')}") format("woff2");
  font-weight: 700;
  font-style: normal;
  font-display: block;
}
@font-face {
  font-family: "DM Sans";
  src: url("${staticFile('fonts/dm-sans-latin-400-normal.woff2')}") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: block;
}
@font-face {
  font-family: "DM Sans";
  src: url("${staticFile('fonts/dm-sans-latin-500-normal.woff2')}") format("woff2");
  font-weight: 500;
  font-style: normal;
  font-display: block;
}
`;

export const Fonts: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [handle] = useState(() => delayRender('Loading ProofsTech fonts'));

  useEffect(() => {
    const load = async () => {
      await Promise.all([
        document.fonts.load('600 100px "Bricolage Grotesque"'),
        document.fonts.load('700 100px "Bricolage Grotesque"'),
        document.fonts.load('400 100px "DM Sans"'),
        document.fonts.load('500 100px "DM Sans"'),
      ]);
      await document.fonts.ready;
    };

    load()
      .catch((error) => {
        console.warn('Font load warning', error);
      })
      .finally(() => continueRender(handle));
  }, [handle]);

  return (
    <>
      <style>{fontCss}</style>
      {children}
    </>
  );
};
