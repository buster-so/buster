import type { iconProps } from './iconProps';

function dressShoes(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px dress shoes';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M10.25 7.042L9 8.125"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.75,5.75c.423,.23,1.641,.821,3.25,.625,1.816-.221,2.935-1.299,3.25-1.625,.503,.725,1.156,1.519,2,2.292,1.91,1.748,3.988,2.642,5.586,3.113,.831,.245,1.414,.99,1.414,1.857v.071c0,.397-.278,.735-.668,.812-1.278,.252-2.946,.441-4.88,.306-1.925-.134-3.524-.548-4.702-.95l-.5,1H1.75v-1c-.409-.791-.75-1.85-.75-3.583,0-1.262,.488-2.449,.75-2.917Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.75 12.25L7 12.25"
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

export default dressShoes;
