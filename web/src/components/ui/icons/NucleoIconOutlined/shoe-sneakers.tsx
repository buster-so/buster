import type { iconProps } from './iconProps';

function shoeSneakers(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px shoe sneakers';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M5.838 10.75L17.217 10.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.25,9.065l3.283,.72c.609,.135,1.12,.548,1.382,1.114l1.085,2.351"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.038 5.619L10.235 6.905"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.911,4.106c-.504,1.313-1.726,2.144-3.217,2.144s-2.756-.937-3.26-2.25h-.184c-.552,0-1,.448-1,1v6.25c0,1.104,.895,2,2,2H15.125c1.174,0,2.125-.951,2.125-2.125,0-.744-.383-1.396-.962-1.776L8.045,3.488"
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

export default shoeSneakers;
