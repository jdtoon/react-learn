import { Storefront } from '../mfe-host/Storefront';

export function LabStorefrontPage() {
  return (
    <div className="mx-auto grid w-full max-w-[64rem] gap-8 px-4 py-10 sm:px-8 sm:py-14">
      <title>Storefront lab | React Field Guide</title>
      <header className="grid gap-4">
        <p className="eyebrow">Micro frontends</p>
        <h1>Storefront lab</h1>
        <p className="lede">
          A storefront assembled in the browser from separately built apps. Turn on X-ray to see who
          owns each slot and how it was loaded.
        </p>
      </header>
      <Storefront controls={['xray']} />
    </div>
  );
}
