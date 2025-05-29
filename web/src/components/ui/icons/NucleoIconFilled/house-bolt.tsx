import type { iconProps } from './iconProps';

function houseBolt(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px house bolt';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.309,5.603L10.059,1.613c-.624-.475-1.495-.474-2.118,0L2.691,5.603s0,0,0,0c-.433,.329-.691,.85-.691,1.393v7.254c0,1.517,1.233,2.75,2.75,2.75H13.25c1.517,0,2.75-1.233,2.75-2.75V6.996c0-.543-.258-1.064-.691-1.394Zm-3.67,5.041l-2,3.25c-.141,.229-.386,.357-.639,.357-.107,0-.215-.022-.317-.07-.345-.161-.515-.556-.395-.917l.588-1.763h-1.876c-.271,0-.522-.147-.654-.384-.133-.237-.127-.527,.016-.759l2-3.25c.2-.325,.612-.448,.956-.287,.345,.161,.515,.556,.395,.917l-.588,1.763h1.876c.271,0,.522,.147,.654,.384,.133,.237,.127,.527-.016,.759Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default houseBolt;
