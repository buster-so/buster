import type { iconProps } from './iconProps';

function clockRotateClockwise2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px clock rotate clockwise 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,4c-.414,0-.75,.336-.75,.75v4.25c0,.246,.121,.477,.323,.617l3.25,2.25c.13,.09,.279,.133,.426,.133,.238,0,.472-.113,.617-.323,.236-.34,.151-.808-.19-1.043l-2.927-2.026v-3.857c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M16.25,8.25c-.414,0-.75,.336-.75,.75,0,3.584-2.916,6.5-6.5,6.5s-6.5-2.916-6.5-6.5S5.416,2.5,9,2.5c2.147,0,4.129,1.075,5.331,2.802l-1.46-.202c-.407-.055-.789,.23-.846,.641-.057,.41,.23,.789,.641,.846l2.944,.407c.035,.004,.069,.007,.104,.007,.369,0,.69-.272,.742-.647l.408-2.945c.057-.411-.229-.789-.64-.846-.416-.061-.789,.229-.846,.64l-.117,.845c-1.498-1.887-3.788-3.047-6.26-3.047C4.589,1,1,4.589,1,9s3.589,8,8,8,8-3.589,8-8c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default clockRotateClockwise2;
