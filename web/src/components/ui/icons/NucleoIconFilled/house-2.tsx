import type { iconProps } from './iconProps';

function house2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px house 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m10.738,2.881L6.988.315c-.6-.41-1.376-.41-1.976,0L1.262,2.881s0,0,0,0c-.477.326-.762.866-.762,1.444v4.425c0,1.516,1.233,2.75,2.75,2.75h2v-2.75c0-.414.336-.75.75-.75s.75.336.75.75v2.75h2c1.517,0,2.75-1.234,2.75-2.75v-4.425c0-.578-.285-1.118-.762-1.444Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default house2;
