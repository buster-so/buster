import type { iconProps } from './iconProps';

function arrowSymbolUpRight(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow symbol up right';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M3.75,15c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061L13.47,3.47c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061L4.28,14.78c-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
        <path
          d="M14.25,10.51c-.284,0-.555-.162-.682-.436-.946-2.052-.854-3.853-.572-5.071-1.219,.282-3.019,.373-5.071-.572-.376-.173-.541-.619-.367-.995,.173-.376,.618-.542,.995-.367,2.964,1.366,5.221,.09,5.316,.035,.296-.171,.671-.124,.912,.12,.24,.243,.288,.617,.113,.91-.053,.091-1.329,2.35,.037,5.312,.173,.376,.009,.822-.367,.995-.102,.047-.208,.069-.313,.069Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default arrowSymbolUpRight;
