import type { iconProps } from './iconProps';

function heartBroken(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px heart broken';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12.164,2c-.095,.001-.185,.023-.279,.03l-3.725,4.711,3.175,1.587c.216,.108,.366,.313,.405,.551s-.04,.48-.21,.65l-2,2c-.146,.146-.338,.22-.53,.22s-.384-.073-.53-.22c-.293-.293-.293-.768,0-1.061l1.264-1.264-3.069-1.535c-.202-.101-.348-.288-.396-.508-.049-.22,.003-.451,.144-.628l2.567-3.247c-.838-.803-1.96-1.273-3.156-1.288-2.53,.015-4.582,2.084-4.572,4.609,0,5.253,5.306,8.429,6.932,9.278,.256,.133,.537,.2,.818,.2s.562-.067,.817-.2c1.626-.848,6.933-4.024,6.933-9.275,.009-2.528-2.042-4.597-4.586-4.612Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default heartBroken;
