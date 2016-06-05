import tornado.ioloop
import tornado.web
import subprocess
import urllib2
import tornado.httpclient
import time
CASPER_PATH = r'/usr/bin/casperjs'
processes = {}
ports = range(100, 1000)
class RenderHandler(tornado.web.RequestHandler):
    def get(self):
        args = []
        if self.get_argument("url", None):
            url = self.get_argument("url")
            args.append('--url="%s"' % urllib2.quote(url))
        else:
            self.write_error(400)
            return

        if self.get_argument("proxy", None):
            proxy = self.get_argument("proxy")
            args.append('--proxy="%s"' % proxy)

        if self.get_argument("proxy_auth", None):
            proxy_auth = self.get_argument("proxy_auth")
            args.append('--proxy-auth="%s"' % proxy_auth)

        if self.get_argument("proxy_type", "http"):
            proxy_type = self.get_argument("proxy_type", "http")
            args.append('--proxy-type="%s"' % proxy_type)

        if self.get_argument("load_images", "true"):
            load_images = self.get_argument("load_images", "true")
            args.append('--load-images=%s' % load_images)

        if self.get_argument("user_agent", None):
            user_agent = self.get_argument("user_agent")
            args.append('--user-agent="%s"' % user_agent)

        if self.get_argument("selector", None):
            selector = self.get_argument("selector")
            args.append('--selector=%s' % selector)

        if self.get_argument("xpath", None):
            xpath = self.get_argument("xpath")
            args.append('--xpath=%s' % xpath)

        if self.get_argument("viewport", None):
            viewport = self.get_argument("viewport")
            args.append('--viewport=%s' % viewport)

        if self.get_argument("wait", None):
            wait = self.get_argument("wait")
            args.append('--wait=%s' % wait)

        self.write(unicode(subprocess.check_output([
             CASPER_PATH,
             '/casperjs/scripts/render.js'] + args).decode("utf-8")))

class CaptureHandler(tornado.web.RequestHandler):
    def get(self):
        args = []
        if self.get_argument("url", None):
            url = self.get_argument("url")
            args.append('--url="%s"' % urllib2.quote(url))
        else:
            self.write_error(400)
            return

        if self.get_argument("proxy", None):
            proxy = self.get_argument("proxy")
            args.append('--proxy="%s"' % proxy)

        if self.get_argument("proxy_auth", None):
            proxy_auth = self.get_argument("proxy_auth")
            args.append('--proxy-auth="%s"' % proxy_auth)

        if self.get_argument("proxy_type", "http"):
            proxy_type = self.get_argument("proxy_type", "http")
            args.append('--proxy-type="%s"' % proxy_type)

        if self.get_argument("load_images", "true"):
            load_images = self.get_argument("load_images", "true")
            args.append('--load-images=%s' % load_images)

        if self.get_argument("user_agent", None):
            user_agent = self.get_argument("user_agent")
            args.append('--user-agent="%s"' % urllib2.quote(user_agent))

        if self.get_argument("selector", None):
            selector = self.get_argument("selector")
            args.append('--selector="%s"' % urllib2.quote(selector))

        if self.get_argument("xpath", None):
            xpath = self.get_argument("xpath")
            args.append('--xpath="%s"' % xpath)

        if self.get_argument("viewport", None):
            viewport = self.get_argument("viewport")
            args.append('--viewport=%s' % viewport)

        if self.get_argument("wait", None):
            wait = self.get_argument("wait")
            args.append('--wait=%s' % wait)

        if self.get_argument("image_type", "png"):
            image_type = self.get_argument("image_type", "png")
            args.append('--image-type=%s' % image_type)

        self.write(unicode(subprocess.check_output([
                                                       CASPER_PATH,
                                                       '/casperjs/scripts/capture.js'] + args).decode("utf-8")))

class ExecuteHandler(tornado.web.RequestHandler):
    def get(self):
        args = []
        if self.get_argument("url", None):
            url = self.get_argument("url")
            args.append('--url="%s"' % urllib2.quote(url))

        if self.get_argument("proxy", None):
            proxy = self.get_argument("proxy")
            args.append('--proxy="%s"' % proxy)

        if self.get_argument("proxy_auth", None):
            proxy_auth = self.get_argument("proxy_auth")
            args.append('--proxy-auth="%s"' % proxy_auth)

        if self.get_argument("proxy_type", "http"):
            proxy_type = self.get_argument("proxy_type", "http")
            args.append('--proxy-type="%s"' % proxy_type)

        if self.get_argument("load_images", "true"):
            load_images = self.get_argument("load_images", "true")
            args.append('--load-images=%s' % load_images)

        if self.get_argument("user_agent", None):
            user_agent = self.get_argument("user_agent")
            args.append('--user-agent="%s"' % urllib2.quote(user_agent))

        if self.get_argument("viewport", None):
            viewport = self.get_argument("viewport")
            args.append('--viewport=%s' % viewport)

        if self.get_argument("script", None):
            script = urllib2.quote(self.get_argument("script").replace(r"\n", "").strip())
        else:
            self.write_error(400)
            return

        if self.get_argument("session_id", None):
            session_id = self.get_argument("session_id")
        else:
            self.write_error(400)
            return

        if not session_id in processes:
            port = ports.pop()
            args.append('--port="%d"' % port)
            processes[session_id] = port
            subprocess.Popen([
                                CASPER_PATH,
                                '/casperjs/scripts/execute.js'] + args, stdout=subprocess.PIPE, stdin=subprocess.PIPE,
                            stderr=subprocess.PIPE)
            time.sleep(1)

        http_client = tornado.httpclient.AsyncHTTPClient()

        resp = None
        while resp != "/check_is_ready":
            try:
                response = http_client.fetch("http://127.0.0.1:%d/check_is_ready" % processes[session_id])
                resp = response.body
                print resp
            except tornado.httpclient.HTTPError as e:
                # HTTPError is raised for non-200 responses; the response
                # can be found in e.response.
                print("Error: " + str(e))
            except Exception as e:
                # Other errors are possible, such as IOError.
                print("Error: " + str(e))
        try:
            message = http_client.fetch("http://127.0.0.1:%d/index.html?script=%s" % (processes[session_id], script), request_timeout=30)
        except tornado.httpclient.HTTPError as e:
            # HTTPError is raised for non-200 responses; the response
            # can be found in e.response.
            print("Error: " + str(e))
        except Exception as e:
            # Other errors are possible, such as IOError.
            print("Error: " + str(e))
        http_client.close()
        self.write(message.body)

def make_app():
    return tornado.web.Application([
        (r"/render.html", RenderHandler),
        (r"/capture.html", CaptureHandler),
        (r"/execute.html", ExecuteHandler),
    ])

if __name__ == "__main__":
    app = make_app()
    app.listen(5000)
    tornado.ioloop.IOLoop.current().start()