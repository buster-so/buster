import type { iconProps } from './iconProps';

function cloudHailMixed(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px cloud hail mixed';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M11.75,14.5c-.414,0-.75-.336-.75-.75v-1.5c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M6.25,14.5c-.414,0-.75-.336-.75-.75v-1.5c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M9,13c-.414,0-.75-.336-.75-.75v-1.5c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M14.146,6.327c-.442-2.463-2.611-4.327-5.146-4.327-2.895,0-5.25,2.355-5.25,5.25,0,.128,.005,.258,.017,.39-1.604,.431-2.767,1.885-2.767,3.61,0,1.934,1.477,3.512,3.36,3.71-.225-.35-.36-.764-.36-1.21v-1.5c0-1.241,1.01-2.25,2.25-2.25,.212,0,.414,.039,.609,.094,.283-.919,1.13-1.594,2.141-1.594s1.858,.675,2.141,1.594c.195-.055,.396-.094,.609-.094,1.24,0,2.25,1.009,2.25,2.25v1.5c0,.385-.106,.743-.278,1.06,1.885-.537,3.278-2.255,3.278-4.31,0-1.854-1.15-3.503-2.854-4.173Z"
          fill="currentColor"
        />
        <circle cx="11.75" cy="16.25" fill="currentColor" r=".75" />
        <circle cx="6.25" cy="16.25" fill="currentColor" r=".75" />
        <circle cx="9" cy="14.75" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default cloudHailMixed;
