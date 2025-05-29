import type { iconProps } from './iconProps';

function location2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px location 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13,5c0-2.206-1.794-4-4-4s-4,1.794-4,4c0,1.949,1.402,3.572,3.25,3.924v4.326c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-4.326c1.848-.353,3.25-1.975,3.25-3.924Z"
          fill="currentColor"
        />
        <path
          d="M9,17c-2.971,0-8-.579-8-2.75,0-1.611,2.668-2.284,4.907-2.565,.409-.052,.786,.24,.837,.651,.052,.411-.24,.786-.651,.837-2.264,.285-3.322,.812-3.562,1.078,.365,.414,2.502,1.25,6.468,1.25s6.103-.836,6.468-1.25c-.24-.266-1.297-.793-3.562-1.078-.411-.052-.703-.427-.651-.837,.052-.411,.43-.703,.837-.651,2.239,.281,4.907,.955,4.907,2.565,0,2.171-5.029,2.75-8,2.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default location2;
