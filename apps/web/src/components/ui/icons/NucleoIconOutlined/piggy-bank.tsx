import type { iconProps } from './iconProps';

function piggyBank(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px piggy bank';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M6.25,8c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75,.75,.336,.75,.75-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M13.75 3.5L13.75 5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.495,3.066c-.517,.069-1.015,.19-1.487,.357"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.642,4.435c-.226-.523-.697-1.304-1.621-1.81-1.137-.623-2.235-.432-2.534-.37l1.378,2.387h0c-.697,.587-1.254,1.304-1.62,2.109l-1.995,.25v4l1.995,.25c.422,.926,1.094,1.739,1.945,2.367l.31,2.633h2.25l.085-1.442c.534,.121,1.089,.192,1.665,.192s1.132-.071,1.665-.192l.085,1.442h2.25l.31-2.633c1.449-1.07,2.387-2.669,2.438-4.464"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="13.75"
          cy="4.25"
          fill="none"
          r="3"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default piggyBank;
