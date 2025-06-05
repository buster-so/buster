import type { iconProps } from './iconProps';

function cloudHail(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px cloud hail';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="11.75" cy="16.25" fill="currentColor" r=".75" />
        <circle cx="6.25" cy="16.25" fill="currentColor" r=".75" />
        <circle cx="9" cy="14.75" fill="currentColor" r=".75" />
        <circle cx="11.75" cy="13.25" fill="currentColor" r=".75" />
        <circle cx="6.25" cy="13.25" fill="currentColor" r=".75" />
        <circle cx="9" cy="11.75" fill="currentColor" r=".75" />
        <path
          d="M14.146,6.327c-.442-2.463-2.611-4.327-5.146-4.327-2.895,0-5.25,2.355-5.25,5.25,0,.128,.005,.258,.017,.39-1.604,.431-2.767,1.885-2.767,3.61,0,1.766,1.23,3.241,2.876,3.637,.116-.202,.25-.392,.412-.558-.178-.322-.288-.686-.288-1.079,0-1.241,1.01-2.25,2.25-2.25,.212,0,.414,.039,.609,.094,.283-.919,1.13-1.594,2.141-1.594s1.858,.675,2.141,1.594c.195-.055,.396-.094,.609-.094,1.24,0,2.25,1.009,2.25,2.25,0,.393-.11,.757-.288,1.079,.117,.119,.224,.247,.318,.385,1.727-.629,2.97-2.272,2.97-4.214,0-1.854-1.15-3.503-2.854-4.173Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default cloudHail;
