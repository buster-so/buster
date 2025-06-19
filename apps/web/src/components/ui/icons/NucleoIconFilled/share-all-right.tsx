import type { iconProps } from './iconProps';

function shareAllRight(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px share all right';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14,8.423c-.001-.212-.093-.414-.252-.555L8.248,2.982c-.222-.197-.537-.245-.805-.124-.27,.121-.443,.389-.443,.684v2.508C.188,6.521,0,13.374,0,13.445c-.005,.324,.198,.614,.504,.72,.081,.028,.164,.042,.246,.042,.229,0,.451-.105,.596-.294,.021-.027,2.021-2.585,5.654-2.906v2.45c0,.297,.176,.566,.448,.687,.271,.118,.589,.068,.808-.133l5.5-5.029c.157-.144,.246-.347,.244-.559Z"
          fill="currentColor"
        />
        <path
          d="M17.748,7.868L12.248,2.982c-.311-.276-.785-.247-1.059,.062-.275,.31-.247,.784,.062,1.059l4.878,4.333-4.886,4.467c-.306,.28-.327,.754-.048,1.06,.148,.162,.351,.244,.554,.244,.181,0,.362-.065,.506-.196l5.5-5.029c.157-.144,.246-.347,.244-.559s-.093-.414-.252-.555Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default shareAllRight;
