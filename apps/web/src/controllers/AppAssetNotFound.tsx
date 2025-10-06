import type { AssetType } from '@buster/server-shared/assets';
import type { ResponseMessageFileType } from '@buster/server-shared/chats';
import { Link } from '@tanstack/react-router';
import { BusterLogo } from '@/assets/svg/BusterLogo';
import { Button } from '@/components/ui/buttons';
import { Title } from '@/components/ui/typography';
import { useMount } from '@/hooks/useMount';

export const AppAssetNotFound: React.FC<{
  assetId: string;
  type: AssetType | ResponseMessageFileType;
}> = ({ type, assetId }) => {
  useMount(() => {
    console.info('AppAssetNotFound for asset:', assetId, 'and type:', type);
  });
  return (
    <div className="flex h-full w-full flex-col items-center justify-center space-y-6 bg-background">
      <BusterLogo className="h-16 w-16" />

      <div className="max-w-[550px] text-center">
        <Title as="h2" className="text-center">
          {`It looks like this asset is does not exist...`}
        </Title>
      </div>

      <div className="flex space-x-2">
        <Link to="/app/home">
          <Button>Go home</Button>
        </Link>
      </div>
    </div>
  );
};
