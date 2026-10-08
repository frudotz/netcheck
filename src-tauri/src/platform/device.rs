// Cihaz adı — ağ anlık görüntüsündeki `hostname` alanı.
//
// | Hedef     | Kaynak                                                                       |
// |-----------|------------------------------------------------------------------------------|
// | Masaüstü  | işletim sistemi hostname'i (`gethostname`) — önceki davranış                   |
// | Android   | `Settings.Global.DEVICE_NAME` (kullanıcının gördüğü ad), yoksa `Build.MODEL`   |
// | iOS       | `gethostname` (henüz özel uygulama yok)                                        |
//
// Android'de `gethostname` neredeyse her zaman "localhost" döner; bu gerçek bir ad değildir ve
// gösterilmez (değer yoksa "Kullanılamıyor").

pub fn name() -> Option<String> {
    imp::name().map(|n| n.trim().to_string()).filter(|n| !n.is_empty() && !is_placeholder(n))
}

/// Mobil işletim sistemlerinin anlamsız varsayılan değerleri.
fn is_placeholder(name: &str) -> bool {
    cfg!(mobile) && matches!(name.to_ascii_lowercase().as_str(), "localhost" | "localhost.localdomain")
}

#[cfg(not(target_os = "android"))]
mod imp {
    pub fn name() -> Option<String> {
        Some(gethostname::gethostname().to_string_lossy().into_owned())
    }
}

#[cfg(target_os = "android")]
mod imp {
    use jni::objects::{JObject, JString, JValue};
    use jni::{JNIEnv, JavaVM};

    /// Android bağlamı (`ndk_context`) Tauri/tao tarafından uygulama başlarken kurulur; IPC komutları
    /// ancak bundan sonra çalışabildiği için burada kullanılabilir (netdev'in Android yolu da aynı varsayım).
    pub fn name() -> Option<String> {
        let ctx = ndk_context::android_context();
        let vm = unsafe { JavaVM::from_raw(ctx.vm().cast()) }.ok()?;
        let mut env = vm.attach_current_thread().ok()?;
        let context = unsafe { JObject::from_raw(ctx.context().cast()) };
        if context.is_null() {
            return None;
        }
        settings_device_name(&mut env, &context).or_else(|| build_model(&mut env))
    }

    /// `Settings.Global.getString(resolver, "device_name")` (API 25+; eski sürümlerde null).
    fn settings_device_name(env: &mut JNIEnv, context: &JObject) -> Option<String> {
        let resolver = checked(env, |env| {
            env.call_method(context, "getContentResolver", "()Landroid/content/ContentResolver;", &[])?.l()
        })?;
        let key = checked(env, |env| env.new_string("device_name"))?;
        let value = checked(env, |env| {
            env.call_static_method(
                "android/provider/Settings$Global",
                "getString",
                "(Landroid/content/ContentResolver;Ljava/lang/String;)Ljava/lang/String;",
                &[JValue::Object(&resolver), JValue::Object(&key)],
            )?
            .l()
        })?;
        to_string(env, value)
    }

    /// `android.os.Build.MODEL` (ör. "Pixel 7") — cihaz adı yoksa.
    fn build_model(env: &mut JNIEnv) -> Option<String> {
        let value = checked(env, |env| env.get_static_field("android/os/Build", "MODEL", "Ljava/lang/String;")?.l())?;
        to_string(env, value)
    }

    fn to_string(env: &mut JNIEnv, value: JObject) -> Option<String> {
        if value.is_null() {
            return None;
        }
        checked(env, |env| env.get_string(&JString::from(value)).map(String::from))
    }

    /// JNI çağrısı başarısız olursa bekleyen Java istisnası temizlenir; aksi halde sonraki JNI
    /// çağrısı uygulamayı sonlandırır.
    fn checked<'local, T>(
        env: &mut JNIEnv<'local>,
        f: impl FnOnce(&mut JNIEnv<'local>) -> jni::errors::Result<T>,
    ) -> Option<T> {
        let result = f(env);
        if env.exception_check().unwrap_or(false) {
            let _ = env.exception_clear();
        }
        result.ok()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn desktop_keeps_os_hostname() {
        if cfg!(desktop) {
            let raw = gethostname::gethostname().to_string_lossy().trim().to_string();
            assert_eq!(name(), (!raw.is_empty()).then_some(raw));
            assert!(!is_placeholder("localhost"), "desktop never filters hostnames");
        }
    }
}
