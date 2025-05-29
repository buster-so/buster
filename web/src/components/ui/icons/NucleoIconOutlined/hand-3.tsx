import type { iconProps } from './iconProps';

function hand3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px hand 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m10.25,7.75V2.5c0-.69-.564-1.25-1.25-1.25s-1.25.56-1.25,1.25v5.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m7.75,3.75c0-.69-.564-1.25-1.25-1.25s-1.25.56-1.25,1.25v4"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m12.75,9.25V3.75c0-.69-.564-1.25-1.25-1.25s-1.25.56-1.25,1.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m5.249,5.25c0-.69-.564-1.25-1.25-1.25s-1.25.56-1.25,1.25v5.4844c0,3.3202,2.6964,6.0092,6.0166,6l1.001-.0028c3.3072-.0092,5.9834-2.6928,5.9834-6v-3.9816s-1,0-1,0c-1.1046,0-2,.8954-2,2v1.5c-1.5727,0-2.8627,1.2101-2.9897,2.75"
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

export default hand3;
