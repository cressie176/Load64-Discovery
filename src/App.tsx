import { Placeholder } from "./screens/Placeholder";
import { StoreProvider } from "./store/StoreContext";

export function App() {
	return (
		<StoreProvider>
			<Placeholder name="Load!64" />
		</StoreProvider>
	);
}
