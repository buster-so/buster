import type { iconProps } from './iconProps';

function arrowBoldDown(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow bold down';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.993,8h-1.993V2.75c0-.965-.785-1.75-1.75-1.75h-2.5c-.965,0-1.75,.785-1.75,1.75v5.25h-1.993c-.479,0-.907,.266-1.12,.695-.212,.428-.165,.931,.124,1.311l4.993,6.581c.239,.314,.602,.494,.996,.494s.757-.18,.996-.495l4.993-6.581c.289-.38,.336-.883,.124-1.311-.213-.429-.642-.695-1.12-.695Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default arrowBoldDown;
