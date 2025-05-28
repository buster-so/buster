import React from 'react';

import type { iconProps } from './iconProps';

function mirrorObj(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px mirror obj';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="9" cy="9" fill="currentColor" r=".75" />
        <circle cx="9" cy="2.75" fill="currentColor" r=".75" />
        <circle cx="9" cy="5.875" fill="currentColor" r=".75" />
        <circle cx="9" cy="12.125" fill="currentColor" r=".75" />
        <circle cx="9" cy="15.25" fill="currentColor" r=".75" />
        <path
          d="M3.246,15.482c-.388,0-.767-.13-1.079-.376-.424-.334-.667-.835-.667-1.375V5.539c0-.812,.552-1.512,1.342-1.702l3.483-.836c.399-.093,.807,.151,.904,.555,.097,.402-.151,.808-.555,.904l-3.483,.836c-.112,.027-.191,.127-.191,.243V13.731c0,.105,.06,.168,.096,.197,.034,.028,.109,.073,.213,.046l3.017-.724c.399-.091,.807,.151,.904,.554,.097,.403-.151,.808-.555,.905l-3.017,.724c-.137,.033-.274,.049-.412,.049Z"
          fill="currentColor"
        />
        <path
          d="M15.158,3.836l-3.483-.836c-.224-.053-.46-.002-.639,.141-.181,.142-.286,.359-.286,.589V13.98c0,.347,.237,.648,.575,.729l3.017,.724c.137,.033,.274,.049,.412,.049,.388,0,.767-.13,1.079-.376,.424-.334,.667-.835,.667-1.375V5.539c0-.812-.552-1.512-1.342-1.702Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default mirrorObj;
