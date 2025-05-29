import type { iconProps } from './iconProps';

function potion(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px potion';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="7.25" cy="8.75" fill="currentColor" r=".75" />
        <path
          d="M11.5,5.567V2.5h.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H5.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h.75v3.068c-1.867,.858-3.163,2.613-3.441,4.624,0,.011-.002,.021-.002,.031-.034,.256-.057,.514-.057,.776,0,3.309,2.691,6,6,6,3.01,0,5.502-2.23,5.929-5.124,.002-.02,.008-.038,.009-.057,.037-.269,.063-.541,.063-.819,0-2.34-1.386-4.461-3.5-5.433Zm-2.901,4.788c-1.267,.752-2.874,.579-3.967-.371,.346-1.457,1.405-2.685,2.869-3.206,.299-.106,.499-.389,.499-.707V2.5h2v3.571c0,.317,.2,.6,.499,.707,1.558,.554,2.669,1.905,2.936,3.485-1.483-.799-3.325-.805-4.836,.092Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default potion;
