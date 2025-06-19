import type { iconProps } from './iconProps';

function bagShopping2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px bag shopping 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M5.04,2.25h7.92c1.019,0,1.875,.766,1.988,1.779l1.056,9.5c.132,1.185-.796,2.221-1.988,2.221H3.985c-1.192,0-2.119-1.036-1.988-2.221L3.052,4.029c.113-1.013,.969-1.779,1.988-1.779Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.75,5.25c0,1.519-1.231,2.75-2.75,2.75s-2.75-1.231-2.75-2.75"
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

export default bagShopping2;
