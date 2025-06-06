import type { iconProps } from './iconProps';

function patches(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px patches';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9,3.697l-.861-.861c-.781-.781-2.047-.781-2.828,0l-2.475,2.475c-.781,.781-.781,2.047,0,2.828l.861,.861"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.303,9l.861,.861c.781,.781,.781,2.047,0,2.828l-2.475,2.475c-.781,.781-2.047,.781-2.828,0l-.861-.861"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.652,11.652l3.513-3.513c.781-.781,.781-2.047,0-2.828l-2.475-2.475c-.781-.781-2.047-.781-2.828,0l-3.513,3.513-3.513,3.513c-.781,.781-.781,2.047,0,2.828l2.475,2.475c.781,.781,2.047,.781,2.828,0,0,0,3.513-3.513,3.513-3.513Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="9.25" cy="6.75" fill="currentColor" r=".75" />
        <circle cx="11.25" cy="8.75" fill="currentColor" r=".75" />
        <circle cx="6.75" cy="9.25" fill="currentColor" r=".75" />
        <circle cx="8.75" cy="11.25" fill="currentColor" r=".75" />
        <circle cx="9" cy="9" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default patches;
