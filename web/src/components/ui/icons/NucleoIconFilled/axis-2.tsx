import type { iconProps } from './iconProps';

function axis2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px axis 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.224 15.168L9.75 9.894 9.75 2.25 8.25 2.25 8.25 9.894 1.776 15.168 2.724 16.332 9 11.218 15.276 16.332 16.224 15.168z"
          fill="currentColor"
        />
        <path
          d="M5.75,16.5H2.25c-.414,0-.75-.336-.75-.75v-3.5c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2.75h2.75c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M15.75,16.5h-3.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h2.75v-2.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v3.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M11.475,5.487c-.192,0-.384-.073-.53-.22l-1.945-1.944-1.945,1.944c-.293,.293-.768,.293-1.061,0s-.293-.768,0-1.061l2.475-2.475c.293-.293,.768-.293,1.061,0l2.475,2.475c.293,.293,.293,.768,0,1.061-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default axis2;
