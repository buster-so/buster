import type { iconProps } from './iconProps';

function sailboat(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px sailboat';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.28,8.72L6.78,1.22c-.214-.214-.537-.279-.817-.163s-.463,.39-.463,.693V12.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-2.25h6.75c.303,0,.577-.183,.693-.463s.052-.603-.163-.817Z"
          fill="currentColor"
        />
        <path
          d="M16.911,11.896c-.13-.244-.385-.396-.661-.396H1.75c-.276,0-.531,.152-.661,.396-.131,.244-.116,.54,.037,.77l1.703,2.555c.325,.488,.87,.779,1.456,.779H13.715c.586,0,1.131-.292,1.456-.779l1.703-2.555c.153-.23,.168-.526,.037-.77Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default sailboat;
