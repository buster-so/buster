import type { iconProps } from './iconProps';

function refreshAnticlockwise(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px refresh anticlockwise';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M7.75 8.25L10.75 8.25 10.75 11.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m10.718,8.306c-.854,1.743-2.646,2.944-4.718,2.944-2.832,0-5.141-2.243-5.246-5.049"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.25 3.75L1.25 3.75 1.25 0.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m1.282,3.694C2.136,1.951,3.928.75,6,.75c2.832,0,5.141,2.243,5.246,5.049"
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

export default refreshAnticlockwise;
