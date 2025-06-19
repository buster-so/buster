import type { iconProps } from './iconProps';

function pinTack(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px pin tack';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,17c-.414,0-.75-.336-.75-.75v-4c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v4c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M13.929,8.997c-.266-.456-.578-.888-.929-1.288V3.75c0-1.517-1.233-2.75-2.75-2.75h-2.5c-1.517,0-2.75,1.233-2.75,2.75v3.959c-.352,.4-.663,.832-.929,1.288-.563,.965-.921,2.027-1.065,3.158-.027,.214,.039,.429,.181,.59,.143,.162,.348,.254,.563,.254H14.25c.215,0,.42-.093,.563-.254,.142-.162,.208-.376,.181-.59-.144-1.131-.502-2.193-1.065-3.158Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default pinTack;
