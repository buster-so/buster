import type { iconProps } from './iconProps';

function windowAlert(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px window alert';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle cx="4.25" cy="5.25" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="6.75" cy="5.25" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="13.25" cy="17.25" fill="currentColor" r=".75" strokeWidth="0" />
        <path
          d="M1.75 7.75L16.25 7.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m16.25,9.3144v-4.5644c0-1.104-.895-2-2-2H3.75c-1.105,0-2,.896-2,2v8.5c0,1.104.895,2,2,2h3.1037"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m15.75,16.75h.433c.7881,0,1.2665-.8692.8448-1.5351l-2.933-4.631c-.3926-.6199-1.297-.6199-1.6896,0l-2.933,4.631c-.4217.6658.0567,1.5351.8448,1.5351h.433"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.25 13.25L13.25 15.25"
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

export default windowAlert;
