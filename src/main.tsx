import {createRoot} from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './components/GlobalStyles.css'
import frontendKeepAlive from './utils/keepAlive'
import {DevSupport} from "@react-buddy/ide-toolbox";
import {ComponentPreviews, useInitial} from "@/dev";

// Start keep-alive service to prevent backend sleeping
frontendKeepAlive.start();

createRoot(document.getElementById("root")!).render(<DevSupport ComponentPreviews={ComponentPreviews}
                                                                useInitialHook={useInitial}
>
    <App/>
</DevSupport>);
