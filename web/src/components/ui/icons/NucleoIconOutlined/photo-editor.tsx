import type { iconProps } from './iconProps';

function photoEditor(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px photo editor';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9,7.688c1.065,.823,1.75,2.113,1.75,3.562,0,2.485-2.015,4.5-4.5,4.5S1.75,13.735,1.75,11.25c0-1.87,1.14-3.473,2.763-4.153"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.263,10.903c.177-2.323,2.118-4.153,4.487-4.153,2.485,0,4.5,2.015,4.5,4.5s-2.015,4.5-4.5,4.5c-1.036,0-1.99-.35-2.75-.938"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.737,10.903c-.534,.224-1.121,.347-1.737,.347-2.485,0-4.5-2.015-4.5-4.5S6.515,2.25,9,2.25s4.5,2.015,4.5,4.5c0,.117-.004,.233-.013,.347"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default photoEditor;
