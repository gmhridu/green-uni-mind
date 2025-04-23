import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGetMeQuery } from "@/redux/features/auth/authApi";
import { selectCurrentUser } from "@/redux/features/auth/authSlice";
import { useAppSelector } from "@/redux/hooks";

const EditUserProfile = () => {
  const user = useAppSelector(selectCurrentUser);

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center pt-[75px]">
      <div className="flex flex-col md:flex-row w-full max-w-[84rem] border rounded-lg bg-white shadow-sm md:my-5 md:mx-5">
        {/* Sidebar */}
        <aside className="w-full md:w-64 border-r bg-gray-50 p-6">
          <div className="flex flex-col items-center space-y-4 mb-8">
            <div>
              <Avatar className="w-[6.4rem] h-[6.4rem] object-cover">
                <AvatarImage src={user?.photoUrl} />
                <AvatarFallback className="bg-black text-white font-semibold text-lg">
                  {(user?.name?.slice(0, 2) || "US").toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <h1 className="font-bold text-center">Mahabub Hasan Hridoy</h1>
          </div>

          <ul className="space-y-2 text-sm text-gray-700">
            <li className="font-medium text-black">Profile</li>
            <li>Photo</li>
            <li>Account Security</li>
            <li>Subscriptions</li>
            <li>Payment Methods</li>
            <li>Privacy</li>
            <li>Notification Preferences</li>
            <li>API Clients</li>
            <li>Close Account</li>
          </ul>
        </aside>

        {/* Main Form Section */}
        <main className="flex-1 p-6">
          <h2 className="text-2xl font-semibold mb-6">Public profile</h2>
          <p className="text-gray-600 mb-6">Add information about yourself</p>

          <form className="space-y-6 max-w-xl">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                First Name
              </label>
              <input
                type="text"
                placeholder="First name"
                className="mt-1 block w-full p-2 border rounded-md shadow-sm focus:ring focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Last Name
              </label>
              <input
                type="text"
                placeholder="Last name"
                className="mt-1 block w-full p-2 border rounded-md shadow-sm focus:ring focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Headline
              </label>
              <input
                type="text"
                placeholder="Add a professional headline..."
                className="mt-1 block w-full p-2 border rounded-md shadow-sm focus:ring focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Bio
              </label>
              <textarea
                rows={4}
                placeholder="Write something about yourself..."
                className="mt-1 block w-full p-2 border rounded-md shadow-sm focus:ring focus:ring-indigo-300"
              />
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};

export default EditUserProfile;
