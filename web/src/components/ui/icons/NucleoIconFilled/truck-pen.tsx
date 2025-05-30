import type { iconProps } from './iconProps';

function truckPen(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px truck pen';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M17.722,8.597l-1.796-2.793c-.323-.503-.874-.804-1.472-.804h-1.454v-.25c0-1.517-1.233-2.75-2.75-2.75h-1.505c-.105,.594-.383,1.143-.82,1.58l-3.727,3.727c-.319,.32-.696,.566-1.121,.731l-1.511,.589c-.259,.102-.535,.154-.817,.154-.257,0-.51-.053-.75-.139v3.108c0,1.517,1.233,2.75,2.75,2.75h.081c-.048-.159-.081-.325-.081-.5,0-.967,.784-1.75,1.75-1.75s1.75,.783,1.75,1.75c0,.175-.034,.341-.081,.5h4.413c-.048-.159-.081-.325-.081-.5,0-.967,.784-1.75,1.75-1.75s1.75,.783,1.75,1.75c0,.175-.034,.341-.081,.5h1.331c1.517,0,2.75-1.233,2.75-2.75v-2.206c0-.336-.096-.664-.278-.947Zm-4.722-.097v-2h1.454c.085,0,.164,.043,.21,.115l1.212,1.885h-2.876Z"
          fill="currentColor"
        />
        <path
          d="M6.857,.424c-.563-.563-1.538-.566-2.098-.005L1.065,4.113c-.164,.164-.292,.358-.38,.577L.055,6.25c-.112,.277-.048,.595,.162,.808,.144,.145,.337,.223,.534,.223,.092,0,.184-.017,.272-.051l1.513-.59c.228-.088,.431-.221,.603-.394l3.725-3.725c.281-.282,.434-.654,.432-1.05-.002-.395-.158-.767-.438-1.047Z"
          fill="currentColor"
        />
        <path
          d="M4.5,16.5c-1.378,0-2.5-1.122-2.5-2.5s1.122-2.5,2.5-2.5,2.5,1.122,2.5,2.5-1.122,2.5-2.5,2.5Zm0-3.5c-.551,0-1,.449-1,1s.449,1,1,1,1-.449,1-1-.449-1-1-1Z"
          fill="currentColor"
        />
        <path
          d="M12.25,16.5c-1.378,0-2.5-1.122-2.5-2.5s1.122-2.5,2.5-2.5,2.5,1.122,2.5,2.5-1.122,2.5-2.5,2.5Zm0-3.5c-.551,0-1,.449-1,1s.449,1,1,1,1-.449,1-1-.449-1-1-1Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default truckPen;
