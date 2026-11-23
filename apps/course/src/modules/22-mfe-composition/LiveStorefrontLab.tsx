import { Storefront } from '../../mfe-host/Storefront';

export function LiveStorefrontLab() {
  return <Storefront controls={['xray', 'kill']} />;
}
