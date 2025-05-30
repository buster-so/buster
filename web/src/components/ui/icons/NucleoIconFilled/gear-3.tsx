import type { iconProps } from './iconProps';

function gear3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px gear 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.676,6.934l-.907-.32c-.104-.251-.22-.499-.358-.739-.131-.227-.296-.425-.451-.631l.184-.983c.153-.826-.232-1.664-.96-2.084l-.352-.203c-.728-.42-1.645-.336-2.284,.211l-.729,.624c-.543-.073-1.087-.08-1.623-.01l-.728-.623c-.639-.546-1.557-.632-2.285-.211l-.351,.203c-.728,.419-1.113,1.257-.959,2.084l.174,.933c-.326,.423-.575,.9-.784,1.399l-.939,.331c-.792,.28-1.324,1.033-1.324,1.873v.405c0,.841,.532,1.593,1.324,1.873l.906,.32c.104,.251,.219,.499,.358,.738,.131,.228,.296,.426,.452,.632l-.184,.983c-.153,.826,.232,1.664,.96,2.084l.352,.203c.309,.178,.651,.266,.992,.266,.463,0,.924-.162,1.292-.477l.724-.62c.278,.037,.556,.057,.833,.057,.266,0,.531-.018,.794-.052l.729,.624c.368,.315,.829,.477,1.293,.477,.341,0,.684-.087,.992-.266l.351-.203c.728-.419,1.113-1.257,.959-2.084l-.174-.934c.326-.423,.574-.899,.783-1.397l.94-.332c.792-.28,1.324-1.033,1.324-1.873v-.405c0-.841-.532-1.593-1.324-1.873Zm-6.676,5.066c-1.657,0-3-1.343-3-3s1.343-3,3-3,3,1.343,3,3-1.343,3-3,3Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default gear3;
