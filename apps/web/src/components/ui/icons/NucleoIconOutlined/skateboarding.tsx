import type { iconProps } from './iconProps';

function skateboarding(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px skateboarding';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="12.5"
          cy="2.75"
          fill="none"
          r="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="8.75" cy="16.75" fill="currentColor" r=".75" />
        <circle cx="12.75" cy="16.75" fill="currentColor" r=".75" />
        <path
          d="M4.25,5.25h4.932c1.243,0,1.946,1.425,1.191,2.411l-1.703,2.223"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.899,11.23l-.388,.61c-.165,.259-.439,.428-.744,.458l-2.017,.202"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.119,5.25l-1.656,2.164c-.607,.793-.283,1.947,.648,2.309l2.002,.778c.384,.149,.638,.52,.638,.932v2.816"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.235,13.894c.183,.218,.458,.356,.765,.356h6.25"
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

export default skateboarding;
