import type { iconProps } from './iconProps';

function arrowSymbolUpLeft(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow symbol up left';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.25,15c-.192,0-.384-.073-.53-.22L3.47,4.53c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0L14.78,13.72c.293,.293,.293,.768,0,1.061-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
        <path
          d="M3.75,10.51c-.105,0-.212-.022-.313-.069-.377-.173-.541-.619-.367-.995,1.365-2.963,.089-5.221,.034-5.316-.172-.295-.123-.671,.12-.912,.242-.241,.615-.287,.91-.113,.092,.053,2.349,1.33,5.313-.037,.372-.173,.82-.01,.995,.367,.173,.376,.009,.822-.368,.995-2.052,.946-3.853,.854-5.07,.572,.281,1.218,.373,3.019-.573,5.071-.126,.274-.397,.436-.681,.436Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default arrowSymbolUpLeft;
