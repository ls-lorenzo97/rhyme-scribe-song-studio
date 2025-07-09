import Component from '../../apple-music-interface';
export default function WrappedComponent() {
  return (
    <div className="min-h-screen bg-background text-foreground" data-name="index-root">
      <Component />
    </div>
  );
}
