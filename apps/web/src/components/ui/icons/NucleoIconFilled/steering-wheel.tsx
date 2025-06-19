import type { iconProps } from './iconProps';

function steeringWheel(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px steering wheel';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.135,7.752l-4.898-.342c-.499-.7-1.312-1.16-2.237-1.16s-1.738,.46-2.237,1.16l-4.901,.357c-.069,.401-.112,.812-.112,1.233,0,.423,.044,.836,.113,1.239l4.9,.351c.178,.25,.397,.468,.647,.646l.352,4.9c.403,.07,.815,.113,1.238,.113s.835-.044,1.238-.113l.352-4.9c.25-.178,.468-.396,.647-.646l4.901-.359c.069-.401,.112-.811,.112-1.232,0-.426-.044-.842-.115-1.248Zm-7.135,2.248c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Z"
          fill="currentColor"
        />
        <path
          d="M9,17c-4.411,0-8-3.589-8-8S4.589,1,9,1s8,3.589,8,8-3.589,8-8,8Zm0-14.5c-3.584,0-6.5,2.916-6.5,6.5s2.916,6.5,6.5,6.5,6.5-2.916,6.5-6.5-2.916-6.5-6.5-6.5Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default steeringWheel;
