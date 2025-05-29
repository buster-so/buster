import type { iconProps } from './iconProps';

function ticket3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px ticket 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M14.5,9c0-.967,.784-1.75,1.75-1.75v-1.5c0-1.104-.895-2-2-2H3.75c-1.105,0-2,.896-2,2v1.5c.966,0,1.75,.783,1.75,1.75s-.784,1.75-1.75,1.75v1.5c0,1.104,.895,2,2,2H14.25c1.105,0,2-.896,2-2v-1.5c-.966,0-1.75-.783-1.75-1.75Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.776,7.994c-.059-.181-.215-.313-.404-.34l-1.329-.193-.595-1.204c-.168-.342-.729-.342-.896,0l-.595,1.204-1.329,.193c-.188,.027-.345,.159-.404,.34-.059,.181-.01,.379,.126,.512l.962,.938-.227,1.324c-.032,.188,.045,.377,.199,.489,.155,.113,.359,.127,.527,.038l1.188-.625,1.188,.625c.073,.039,.153,.058,.233,.058,.104,0,.207-.032,.294-.096,.154-.112,.231-.301,.199-.489l-.227-1.324,.962-.938c.136-.133,.185-.332,.126-.512Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default ticket3;
