import type { iconProps } from './iconProps';

function circleUserMinus(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px circle user minus';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M17.25,4.5h-5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M9,11.5c-2.027,0-3.828,1.313-4.476,3.196,1.233,.97,2.785,1.554,4.476,1.554s3.242-.583,4.475-1.553c-.657-1.891-2.453-3.197-4.475-3.197Z"
          fill="currentColor"
        />
        <path
          d="M9,17c-4.411,0-8-3.589-8-8S4.589,1,9,1c.559,0,1.118,.058,1.661,.173,.405,.085,.665,.483,.579,.889-.086,.406-.487,.661-.889,.579-.442-.093-.897-.141-1.352-.141-3.584,0-6.5,2.916-6.5,6.5s2.916,6.5,6.5,6.5,6.5-2.916,6.5-6.5c0-.854-.163-1.684-.484-2.465-.157-.383,.026-.822,.409-.979,.385-.156,.822,.026,.979,.409,.396,.963,.596,1.985,.596,3.035,0,4.411-3.589,8-8,8Z"
          fill="currentColor"
        />
        <circle cx="9" cy="7.75" fill="currentColor" r="2.75" />
      </g>
    </svg>
  );
}

export default circleUserMinus;
