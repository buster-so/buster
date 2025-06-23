import type { iconProps } from './iconProps';

function textSize(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px text size';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M17.949,12.979L14.264,3.479c-.112-.289-.39-.479-.699-.479h-.61c-.31,0-.587,.19-.699,.479l-3.685,9.5c-.15,.386,.042,.82,.428,.97,.383,.149,.82-.042,.97-.428l.784-2.021h5.014l.784,2.021c.115,.297,.399,.479,.699,.479,.09,0,.182-.016,.271-.051,.386-.15,.578-.584,.428-.97Zm-6.614-2.979l1.925-4.962,1.925,4.962h-3.85Z"
          fill="currentColor"
        />
        <path
          d="M7.038,12.959l-2.73-6.5c-.117-.278-.39-.459-.691-.459h-.136c-.302,0-.575,.181-.691,.459L.059,12.959c-.161,.382,.019,.822,.401,.982,.095,.04,.193,.059,.29,.059,.293,0,.571-.172,.692-.459l.437-1.041h3.339l.437,1.041c.161,.382,.6,.562,.982,.401,.382-.16,.562-.6,.401-.982Zm-4.529-1.959l1.04-2.475,1.039,2.475H2.509Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default textSize;
