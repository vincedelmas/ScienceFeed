import {Button} from "@/lib/client/components/ui/button";
import {ErrorComponent, type ErrorComponentProps, Link, rootRouteId, useMatch, useRouter} from "@tanstack/react-router";


export function DefaultCatchBoundary({ error }: Readonly<ErrorComponentProps>) {
    const router = useRouter();
    const isRoot = useMatch({ strict: false, select: (state) => state.id === rootRouteId });

    return (
        <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-6 p-4">
            <ErrorComponent error={error}/>
            <div className="flex flex-wrap items-center gap-2">
                <Button
                    type="button"
                    onClick={() => {
                        void router.invalidate();
                    }}
                >
                    Try Again
                </Button>
                {isRoot ?
                    <Button render={<Link to="/"/>} nativeButton={false} variant="secondary">
                        Home
                    </Button>
                    :
                    <Button
                        variant="secondary"
                        nativeButton={false}
                        render={
                            <Link
                                to="/"
                                onClick={(ev) => {
                                    ev.preventDefault();
                                    window.history.back();
                                }}
                            />
                        }
                    >
                        Go Back
                    </Button>
                }
            </div>
        </div>
    );
}
