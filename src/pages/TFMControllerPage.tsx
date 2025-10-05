import { TFMController } from '@/components/TFMController';
import { UserMenu } from '@/components/UserMenu';

const TFMControllerPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-4 right-4 z-50">
        <UserMenu />
      </div>
      <TFMController />
    </div>
  );
};

export default TFMControllerPage;
