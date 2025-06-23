import type { iconProps } from './iconProps';

function closingQuotationMark(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px closing quotation mark';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12.75,16c-.3,0-.583-.182-.699-.478-.15-.386,.042-.821,.427-.971,1.317-.512,2.816-1.556,3.003-5.051h-3.731c-.965,0-1.75-.785-1.75-1.75v-3c0-.965,.785-1.75,1.75-1.75h3.5c.965,0,1.75,.785,1.75,1.75v4c0,3.856-1.264,6.144-3.978,7.199-.089,.035-.182,.051-.272,.051Z"
          fill="currentColor"
        />
        <path
          d="M3.75,16c-.3,0-.583-.182-.699-.478-.15-.386,.042-.821,.427-.971,1.317-.512,2.816-1.556,3.003-5.051H2.75c-.965,0-1.75-.785-1.75-1.75v-3c0-.965,.785-1.75,1.75-1.75h3.5c.965,0,1.75,.785,1.75,1.75v4c0,3.856-1.264,6.144-3.978,7.199-.089,.035-.182,.051-.272,.051Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default closingQuotationMark;
