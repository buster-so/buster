import type { iconProps } from './iconProps';

function personWalking(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px person walking';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="9.75"
          cy="2.25"
          fill="none"
          r="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.669,9.626l.369-2.457c.112-.747-.467-1.42-1.222-1.42h0c-.612,0-1.132,.448-1.222,1.053l-.415,2.767c-.109,.727,.19,1.456,.778,1.897l1.815,1.361c.15,.113,.266,.266,.333,.441l1.147,2.982"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.389,5.826l-2.923,1.013c-.294,.102-.523,.334-.621,.629l-.594,1.783"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.884,6.367l1.606,2.267c.165,.233,.422,.384,.706,.416l1.804,.2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.692,13.625l-.13,.421c-.041,.134-.111,.259-.203,.364l-1.61,1.839"
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

export default personWalking;
