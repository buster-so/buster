import type { iconProps } from './iconProps';

function flag(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px flag';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.598,2.575c-.247-.129-.545-.11-.776,.049-1,.695-1.928,.984-2.738,.859-.658-.101-1.109-.444-1.631-.841-.598-.455-1.274-.97-2.307-1.128-1.004-.155-2.06,.097-3.146,.705V10.48c.06-.022,.125-.025,.179-.062,.999-.695,1.923-.985,2.738-.859,.656,.101,1.106,.443,1.627,.839,.598,.455,1.276,.971,2.312,1.129,.201,.031,.404,.046,.61,.046,1.029,0,2.107-.388,3.213-1.156,.201-.14,.321-.37,.321-.616V3.24c0-.279-.155-.536-.402-.665Z"
          fill="currentColor"
        />
        <path
          d="M3.75,16.75c-.414,0-.75-.336-.75-.75V2c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v14c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default flag;
