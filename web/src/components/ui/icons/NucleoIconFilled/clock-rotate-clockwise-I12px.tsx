import type { iconProps } from './iconProps';

function clockRotateClockwise(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px clock rotate clockwise';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,4c-.414,0-.75,.336-.75,.75v4.25c0,.246,.121,.477,.323,.617l3.25,2.25c.13,.09,.279,.133,.426,.133,.238,0,.472-.113,.617-.323,.236-.34,.151-.808-.19-1.043l-2.927-2.026v-3.857c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M9,1C4.589,1,1,4.589,1,9c0,.414,.336,.75,.75,.75s.75-.336,.75-.75c0-3.584,2.916-6.5,6.5-6.5s6.5,2.916,6.5,6.5-2.916,6.5-6.5,6.5c-2.161,0-4.128-1.073-5.328-2.801l1.457,.202c.407,.052,.789-.23,.846-.641,.057-.41-.23-.789-.641-.846l-2.944-.407c-.41-.052-.789,.23-.845,.64l-.408,2.945c-.057,.411,.229,.789,.64,.846,.035,.005,.07,.007,.104,.007,.369,0,.69-.272,.742-.647l.116-.834c1.493,1.885,3.775,3.036,6.261,3.036,4.411,0,8-3.589,8-8S13.411,1,9,1Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default clockRotateClockwise;
