import type { iconProps } from './iconProps';

function cloudShowers(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px cloud showers';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,15.5c-.414,0-.75-.336-.75-.75v-3c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v3c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M6.25,17c-.414,0-.75-.336-.75-.75v-3c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v3c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M14.146,6.327c-.442-2.463-2.611-4.327-5.146-4.327-2.895,0-5.25,2.355-5.25,5.25,0,.128,.005,.258,.017,.39-1.604,.431-2.767,1.885-2.767,3.61,0,1.811,1.29,3.326,3,3.674v-1.674c0-1.241,1.009-2.25,2.25-2.25,.212,0,.414,.039,.609,.094,.283-.919,1.13-1.594,2.141-1.594s1.858,.675,2.141,1.594c.195-.055,.396-.094,.609-.094,1.241,0,2.25,1.009,2.25,2.25v1.474c1.742-.621,3-2.271,3-4.224,0-1.854-1.15-3.503-2.854-4.173Z"
          fill="currentColor"
        />
        <path
          d="M11.75,17c-.414,0-.75-.336-.75-.75v-3c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v3c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default cloudShowers;
