import type { iconProps } from './iconProps';

function viewPlusSign(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px view plus sign';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m9.5,14.25c0-1.2407,1.0093-2.25,2.25-2.25h.25v-.25c0-1.2407,1.0093-2.25,2.25-2.25.8107,0,1.5164.4351,1.9125,1.0798.1378-.1863.2656-.3669.3761-.5344.6182-.9395.6182-2.1514,0-3.0898-1.0962-1.6641-3.5332-4.4561-7.5386-4.4561-4.001,0-6.4404,2.791-7.5386,4.4551-.6182.9395-.6182,2.1514,0,3.0898,1.0962,1.6641,3.5332,4.4561,7.5386,4.4561.1787,0,.3505-.012.523-.0227-.0078-.0759-.023-.1497-.023-.2278Zm-3.5-5.7495c0-1.6543,1.3457-3,3-3s3,1.3457,3,3-1.3457,3-3,3-3-1.3457-3-3Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m16.75,13.5h-1.75v-1.75c0-.414-.336-.75-.75-.75s-.75.336-.75.75v1.75h-1.75c-.414,0-.75.336-.75.75s.336.75.75.75h1.75v1.75c0,.414.336.75.75.75s.75-.336.75-.75v-1.75h1.75c.414,0,.75-.336.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default viewPlusSign;
