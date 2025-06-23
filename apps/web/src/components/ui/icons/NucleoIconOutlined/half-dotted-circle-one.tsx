import type { iconProps } from './iconProps';

function halfDottedCircleOne(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px half dotted circle one';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9,16.25c-4.004,0-7.25-3.246-7.25-7.25S4.996,1.75,9,1.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.25,12.25V5.75s-.745,1.309-2.325,1.612"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="14.127" cy="14.127" fill="currentColor" r=".75" />
        <circle cx="16.25" cy="9" fill="currentColor" r=".75" />
        <circle cx="14.127" cy="3.873" fill="currentColor" r=".75" />
        <circle cx="11.774" cy="15.698" fill="currentColor" r=".75" />
        <circle cx="15.698" cy="11.774" fill="currentColor" r=".75" />
        <circle cx="15.698" cy="6.226" fill="currentColor" r=".75" />
        <circle cx="11.774" cy="2.302" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default halfDottedCircleOne;
