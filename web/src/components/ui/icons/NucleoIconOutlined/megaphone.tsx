import type { iconProps } from './iconProps';

function megaphone(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px megaphone';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M3.75,11.457v2.704c0,.41,.25,.778,.631,.929l1.945,.773c.4,.159,.856,.044,1.134-.284l1.666-1.979"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.954,15.125L2.61,11.002c-.256-.099-.457-.296-.564-.549-.148-.35-.296-.847-.296-1.453,0-.271,.03-.817,.289-1.436,.108-.257,.313-.466,.573-.566,3.638-1.409,6.704-2.715,10.342-4.124"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.5,9c0-.828-.672-1.5-1.5-1.5-.053,0-.103,.01-.155,.016-.058,.452-.095,.945-.095,1.484s.037,1.032,.095,1.484c.052,.005,.102,.016,.155,.016,.828,0,1.5-.672,1.5-1.5Z"
          fill="currentColor"
        />
        <ellipse
          cx="13.5"
          cy="9"
          fill="none"
          rx="2.75"
          ry="6.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default megaphone;
