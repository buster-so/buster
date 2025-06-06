import type { iconProps } from './iconProps';

function personBiking(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px person biking';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="14" cy="13" fill="currentColor" r="3" />
        <circle cx="4" cy="13" fill="currentColor" r="3" />
        <circle cx="10.5" cy="3.5" fill="currentColor" r="1.5" />
        <path
          d="M13.25,7h-2.12c-.061,0-.121-.023-.166-.063l-1.229-1.093c-.709-.631-1.81-.576-2.452,.125l-1.239,1.351c-.361,.394-.521,.923-.439,1.451,.083,.529,.396,.985,.861,1.251l1.971,1.126-.428,2.996c-.059,.41,.226,.79,.636,.849,.036,.005,.072,.007,.107,.007,.367,0,.688-.27,.741-.644l.453-3.166c.07-.51-.172-1.004-.618-1.26l-1.353-.773,1.351-1.67,.642,.571c.32,.285,.733,.442,1.163,.442h2.12c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default personBiking;
